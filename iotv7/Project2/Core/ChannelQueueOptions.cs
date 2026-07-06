namespace Project2.Core
{
    public sealed class ChannelQueueOptions
    {
        public int BackpressureThreshold { get; set; }

        public static ChannelQueueOptions Default()
        {
            return new ChannelQueueOptions
            {
                BackpressureThreshold = 10000
            };
        }
    }
}
